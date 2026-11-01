import fs from "fs";
import path from "path";
import request from "supertest";
import app from "../src/app";
import prisma from "../src/database/prisma-client";
import { OWNER_PASSWORD, PNG_1X1, createOrg, resetDatabase } from "./helpers";

const API = "/api/v1";
const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

jest.mock("../src/modules/email/email.service", () => ({
    emailService: { sendInvitationEmail: jest.fn().mockResolvedValue(undefined) },
}));

beforeEach(resetDatabase);
afterAll(async () => {
    await resetDatabase();
    await prisma.$disconnect();
});

describe("organization provisioning", () => {
    it("gives a new organization the default Robin Labs (Warm Professional) theme and initial preferences", async () => {
        const { organization, owner } = await createOrg("Acme Inc");

        const branding = await prisma.organizationBranding.findUniqueOrThrow({
            where: { organizationId: organization.id },
        });
        expect(branding).toMatchObject({
            themePreset: "warm_professional",
            primaryColor: null,
            secondaryColor: null,
            defaultAppearance: "system",
            sidebarStyle: "solid",
            fontPreset: "default",
            radiusPreset: "comfortable",
            displayName: null,
            logoKey: null,
        });
        expect(organization.ownerId).toBe(owner.id);
        expect(owner.role).toBe("administrator");
        expect(await prisma.userPreference.findUnique({ where: { userId: owner.id } })).toMatchObject({
            appearance: null,
        });
    });

    it("allocates unique slugs for organizations with the same name", async () => {
        const a = await createOrg("Globex");
        const b = await createOrg("Globex");
        expect(a.organization.slug).toBe("globex");
        expect(b.organization.slug).toBe("globex-2");
    });

    it("rolls back the whole organization if the owner cannot be created", async () => {
        const { owner } = await createOrg("First");
        const { provisionOrganization } = await import("../src/modules/organization/organization.service");
        await expect(
            provisionOrganization({
                name: "Duplicate Owner Org",
                owner: { email: owner.email, password: "x".repeat(10), firstName: "A", lastName: "B" },
            })
        ).rejects.toThrow(/already exists/);
        expect(await prisma.organization.count({ where: { name: "Duplicate Owner Org" } })).toBe(0);
    });
});

describe("login and workspace", () => {
    it("returns the organization's branding with the login response", async () => {
        const { owner, ownerToken } = await createOrg("Initech");
        await request(app)
            .put(`${API}/organization/branding`)
            .set(auth(ownerToken))
            .send({ themePreset: "corporate" })
            .expect(200);

        const res = await request(app)
            .post(`${API}/auth/login`)
            .send({ email: owner.email, password: OWNER_PASSWORD })
            .expect(200);

        expect(res.body.data.workspace).toMatchObject({
            organization: { name: "Initech" },
            branding: { themePreset: "corporate", displayName: "Initech" },
            preferences: { appearance: null },
            permissions: { canManageBranding: true, isOwner: true },
        });
    });

    it("requires authentication", async () => {
        await request(app).get(`${API}/organization/workspace`).expect(401);
        await request(app).get(`${API}/organization/branding`).expect(401);
        await request(app).put(`${API}/organization/branding`).send({ themePreset: "minimal" }).expect(401);
    });
});

describe("branding updates", () => {
    it("persists valid changes and normalises HEX colours", async () => {
        const { organization, ownerToken } = await createOrg("Hooli");
        const res = await request(app)
            .put(`${API}/organization/branding`)
            .set(auth(ownerToken))
            .send({
                displayName: "Hooli XYZ",
                themePreset: "warm_professional",
                primaryColor: "#0e7490",
                secondaryColor: "#B45309",
                defaultAppearance: "dark",
                sidebarStyle: "subtle",
                fontPreset: "classic",
                radiusPreset: "rounded",
            })
            .expect(200);

        expect(res.body.data).toMatchObject({ displayName: "Hooli XYZ", primaryColor: "#0E7490" });
        const stored = await prisma.organizationBranding.findUniqueOrThrow({ where: { organizationId: organization.id } });
        expect(stored).toMatchObject({
            displayName: "Hooli XYZ",
            themePreset: "warm_professional",
            primaryColor: "#0E7490",
            secondaryColor: "#B45309",
            defaultAppearance: "dark",
            sidebarStyle: "subtle",
            fontPreset: "classic",
            radiusPreset: "rounded",
        });
    });

    it("clears overrides with null / empty values", async () => {
        const { ownerToken } = await createOrg("Pied Piper");
        await request(app)
            .put(`${API}/organization/branding`)
            .set(auth(ownerToken))
            .send({ displayName: "PP", primaryColor: "#112233" })
            .expect(200);
        const res = await request(app)
            .put(`${API}/organization/branding`)
            .set(auth(ownerToken))
            .send({ displayName: "", primaryColor: null })
            .expect(200);
        expect(res.body.data).toMatchObject({ displayName: "Pied Piper", customDisplayName: null, primaryColor: null });
    });

    it.each([
        [{ primaryColor: "red" }],
        [{ primaryColor: "#12345" }],
        [{ secondaryColor: "#GGGGGG" }],
        [{ primaryColor: "#123456; background:url(x)" }],
        [{ themePreset: "neon" }],
        [{ sidebarStyle: "floating" }],
        [{ displayName: "x".repeat(81) }],
    ])("rejects invalid input %j", async (body) => {
        const { ownerToken } = await createOrg("Validation Co");
        await request(app).put(`${API}/organization/branding`).set(auth(ownerToken)).send(body).expect(400);
    });

    it("rejects server-owned fields such as organizationId and asset keys", async () => {
        const { ownerToken } = await createOrg("Strict Co");
        for (const body of [{ organizationId: "x" }, { logoKey: "branding/other/logo.png" }, { updatedById: "x" }]) {
            await request(app).put(`${API}/organization/branding`).set(auth(ownerToken)).send(body).expect(400);
        }
    });
});

describe("authorization", () => {
    it("allows administrators and the owner, and forbids other roles", async () => {
        const { members } = await createOrg("Roles Inc", ["administrator", "recruiter", "hiring_manager", "employee"]);
        const [admin, recruiter, manager, employee] = members;

        await request(app).put(`${API}/organization/branding`).set(auth(admin.token)).send({ themePreset: "minimal" }).expect(200);
        for (const m of [recruiter, manager, employee]) {
            await request(app).put(`${API}/organization/branding`).set(auth(m.token)).send({ themePreset: "midnight" }).expect(403);
            await request(app)
                .post(`${API}/organization/branding/assets/logo`)
                .set(auth(m.token))
                .attach("file", PNG_1X1, { filename: "logo.png", contentType: "image/png" })
                .expect(403);
            await request(app).delete(`${API}/organization/branding/assets/logo`).set(auth(m.token)).expect(403);
        }

        const ws = await request(app).get(`${API}/organization/workspace`).set(auth(employee.token)).expect(200);
        expect(ws.body.data.permissions).toEqual({ canManageBranding: false, isOwner: false });
        expect(ws.body.data.branding.themePreset).toBe("minimal");
    });

    it("lets an owner manage branding even without an administrator role", async () => {
        const { organization, owner, ownerToken } = await createOrg("Owner Rules");
        await prisma.user.update({ where: { id: owner.id }, data: { role: "recruiter" } });
        const { tokenFor } = await import("./helpers");
        const token = tokenFor({ ...owner, role: "recruiter" });
        expect(ownerToken).not.toBe(token);
        await request(app).put(`${API}/organization/branding`).set(auth(token)).send({ themePreset: "corporate" }).expect(200);
        const stored = await prisma.organizationBranding.findUniqueOrThrow({ where: { organizationId: organization.id } });
        expect(stored.themePreset).toBe("corporate");
    });
});

describe("tenant isolation", () => {
    it("keeps two organizations' branding fully independent", async () => {
        const a = await createOrg("Alpha");
        const b = await createOrg("Beta");

        await request(app)
            .put(`${API}/organization/branding`)
            .set(auth(a.ownerToken))
            .send({ themePreset: "midnight", primaryColor: "#7C3AED", displayName: "Alpha Hiring" })
            .expect(200);
        await request(app)
            .put(`${API}/organization/branding`)
            .set(auth(b.ownerToken))
            .send({ themePreset: "corporate", radiusPreset: "compact" })
            .expect(200);

        const [ra, rb] = await Promise.all([
            request(app).get(`${API}/organization/branding`).set(auth(a.ownerToken)),
            request(app).get(`${API}/organization/branding`).set(auth(b.ownerToken)),
        ]);
        expect(ra.body.data).toMatchObject({
            organizationId: a.organization.id,
            themePreset: "midnight",
            primaryColor: "#7C3AED",
            displayName: "Alpha Hiring",
            radiusPreset: "comfortable",
        });
        expect(rb.body.data).toMatchObject({
            organizationId: b.organization.id,
            themePreset: "corporate",
            primaryColor: null,
            displayName: "Beta",
            radiusPreset: "compact",
        });
    });

    it("ignores client-supplied organization IDs in the query string", async () => {
        const a = await createOrg("Query A");
        const b = await createOrg("Query B");
        const res = await request(app)
            .get(`${API}/organization/branding?organizationId=${b.organization.id}`)
            .set(auth(a.ownerToken))
            .expect(200);
        expect(res.body.data.organizationId).toBe(a.organization.id);

        await request(app)
            .put(`${API}/organization/branding?organizationId=${b.organization.id}`)
            .set(auth(a.ownerToken))
            .send({ themePreset: "minimal" })
            .expect(200);
        const bBranding = await prisma.organizationBranding.findUniqueOrThrow({ where: { organizationId: b.organization.id } });
        expect(bBranding.themePreset).toBe("warm_professional");
    });

    it("stores uploaded assets under the uploader's organization only", async () => {
        const a = await createOrg("Upload A");
        const b = await createOrg("Upload B");
        const res = await request(app)
            .post(`${API}/organization/branding/assets/logo`)
            .set(auth(a.ownerToken))
            .attach("file", PNG_1X1, { filename: "../../evil.png", contentType: "image/png" })
            .expect(200);

        const stored = await prisma.organizationBranding.findUniqueOrThrow({ where: { organizationId: a.organization.id } });
        expect(stored.logoKey).toMatch(new RegExp(`^branding/${a.organization.id}/[0-9a-f-]+\\.png$`));
        expect(res.body.data.logoUrl).toBe(`http://api.test/uploads/${stored.logoKey}`);

        const other = await prisma.organizationBranding.findUniqueOrThrow({ where: { organizationId: b.organization.id } });
        expect(other.logoKey).toBeNull();
    });

    it("scopes user management to the caller's organization", async () => {
        const a = await createOrg("Users A", ["employee"]);
        const b = await createOrg("Users B", ["employee"]);
        const bEmployee = b.members[0];

        const list = await request(app).get(`${API}/users`).set(auth(a.ownerToken)).expect(200);
        const emails: string[] = list.body.data.users.map((u: { email: string }) => u.email);
        expect(emails).toEqual(expect.arrayContaining([a.owner.email, a.members[0].email]));
        expect(emails).not.toContain(bEmployee.email);
        expect(emails).not.toContain(b.owner.email);

        await request(app).get(`${API}/users/${bEmployee.id}`).set(auth(a.ownerToken)).expect(404);
        await request(app).patch(`${API}/users/${bEmployee.id}`).set(auth(a.ownerToken)).send({ role: "administrator" }).expect(404);
        await request(app).delete(`${API}/users/${bEmployee.id}`).set(auth(a.ownerToken)).expect(404);

        const untouched = await prisma.user.findUniqueOrThrow({ where: { id: bEmployee.id } });
        expect(untouched).toMatchObject({ role: "employee", isActive: true });
    });

    it("creates invited users in the inviting organization and exposes its branding on the invite", async () => {
        const a = await createOrg("Invite A");
        await request(app)
            .put(`${API}/organization/branding`)
            .set(auth(a.ownerToken))
            .send({ themePreset: "corporate", displayName: "Invite A Careers" })
            .expect(200);

        await request(app)
            .post(`${API}/users/invite`)
            .set(auth(a.ownerToken))
            .send({ email: "new.hire@example.com", role: "recruiter" })
            .expect(201);
        const invitation = await prisma.userInvitation.findUniqueOrThrow({ where: { email: "new.hire@example.com" } });
        expect(invitation.organizationId).toBe(a.organization.id);

        const details = await request(app).get(`${API}/users/invitations/${invitation.token}`).expect(200);
        expect(details.body.data.organization).toMatchObject({
            name: "Invite A Careers",
            branding: { themePreset: "corporate" },
        });
        expect(details.body.data.organization.branding).not.toHaveProperty("organizationId");

        await request(app)
            .post(`${API}/users/invitations/${invitation.token}/accept`)
            .send({ name: "New Hire", password: "Password-123" })
            .expect(200);
        const user = await prisma.user.findUniqueOrThrow({
            where: { email: "new.hire@example.com" },
            include: { preference: true },
        });
        expect(user.organizationId).toBe(a.organization.id);
        expect(user.preference).toMatchObject({ appearance: null });
    });
});

describe("branding assets", () => {
    it("uploads, replaces and removes a logo", async () => {
        const { organization, ownerToken } = await createOrg("Assets Co");
        const upload = () =>
            request(app)
                .post(`${API}/organization/branding/assets/logo`)
                .set(auth(ownerToken))
                .attach("file", PNG_1X1, { filename: "logo.png", contentType: "image/png" })
                .expect(200);

        await upload();
        const first = (await prisma.organizationBranding.findUniqueOrThrow({ where: { organizationId: organization.id } })).logoKey!;
        const firstPath = path.join(process.env.LOCAL_STORAGE_DIR!, first);
        expect(fs.existsSync(firstPath)).toBe(true);

        await upload();
        const second = (await prisma.organizationBranding.findUniqueOrThrow({ where: { organizationId: organization.id } })).logoKey!;
        expect(second).not.toBe(first);
        await new Promise((r) => setTimeout(r, 50)); // old file is deleted asynchronously
        expect(fs.existsSync(firstPath)).toBe(false);

        const removed = await request(app).delete(`${API}/organization/branding/assets/logo`).set(auth(ownerToken)).expect(200);
        expect(removed.body.data.logoUrl).toBeNull();
    });

    it("serves branding images with a cross-origin resource policy", async () => {
        const { organization, ownerToken } = await createOrg("Serve Co");
        await request(app)
            .post(`${API}/organization/branding/assets/logo`)
            .set(auth(ownerToken))
            .attach("file", PNG_1X1, { filename: "logo.png", contentType: "image/png" })
            .expect(200);
        const { logoKey } = await prisma.organizationBranding.findUniqueOrThrow({ where: { organizationId: organization.id } });
        const res = await request(app).get(`/uploads/${logoKey}`).expect(200);
        expect(res.headers["cross-origin-resource-policy"]).toBe("cross-origin");
        expect(res.headers["content-type"]).toBe("image/png");
    });

    it("rejects files whose content is not the declared image type", async () => {
        const { ownerToken } = await createOrg("Spoof Co");
        await request(app)
            .post(`${API}/organization/branding/assets/logo`)
            .set(auth(ownerToken))
            .attach("file", Buffer.from("<svg onload=alert(1)>"), { filename: "logo.png", contentType: "image/png" })
            .expect(400);
    });

    it("rejects unsupported types, oversized files and missing files", async () => {
        const { ownerToken } = await createOrg("Limits Co");
        await request(app)
            .post(`${API}/organization/branding/assets/logo`)
            .set(auth(ownerToken))
            .attach("file", Buffer.from("<svg/>"), { filename: "logo.svg", contentType: "image/svg+xml" })
            .expect(400);

        const big = Buffer.concat([PNG_1X1, Buffer.alloc(3 * 1024 * 1024)]);
        const tooBig = await request(app)
            .post(`${API}/organization/branding/assets/logo`)
            .set(auth(ownerToken))
            .attach("file", big, { filename: "logo.png", contentType: "image/png" })
            .expect(400);
        expect(tooBig.body.message).toMatch(/too large/i);

        // Favicons have a smaller limit (512 KB) than the upload ceiling.
        const mid = Buffer.concat([PNG_1X1, Buffer.alloc(700 * 1024)]);
        await request(app)
            .post(`${API}/organization/branding/assets/favicon`)
            .set(auth(ownerToken))
            .attach("file", mid, { filename: "favicon.png", contentType: "image/png" })
            .expect(400);

        await request(app).post(`${API}/organization/branding/assets/logo`).set(auth(ownerToken)).expect(400);
        await request(app)
            .post(`${API}/organization/branding/assets/banner`)
            .set(auth(ownerToken))
            .attach("file", PNG_1X1, { filename: "x.png", contentType: "image/png" })
            .expect(400);
    });
});

describe("personal preferences", () => {
    it("stores appearance per user without touching organization branding", async () => {
        const { organization, ownerToken, members } = await createOrg("Prefs Co", ["employee"]);
        const [employee] = members;

        await request(app).put(`${API}/users/me/preferences`).set(auth(employee.token)).send({ appearance: "dark" }).expect(200);

        const mine = await request(app).get(`${API}/users/me/preferences`).set(auth(employee.token)).expect(200);
        expect(mine.body.data).toEqual({ appearance: "dark" });
        const owners = await request(app).get(`${API}/users/me/preferences`).set(auth(ownerToken)).expect(200);
        expect(owners.body.data).toEqual({ appearance: null });

        const branding = await prisma.organizationBranding.findUniqueOrThrow({ where: { organizationId: organization.id } });
        expect(branding.defaultAppearance).toBe("system");

        await request(app).put(`${API}/users/me/preferences`).set(auth(employee.token)).send({ appearance: null }).expect(200);
        await request(app).put(`${API}/users/me/preferences`).set(auth(employee.token)).send({ appearance: "neon" }).expect(400);
        await request(app)
            .put(`${API}/users/me/preferences`)
            .set(auth(employee.token))
            .send({ appearance: "dark", userId: ownerToken })
            .expect(400);
    });
});

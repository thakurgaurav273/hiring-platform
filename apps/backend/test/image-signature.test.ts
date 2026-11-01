import { detectImageType } from "../src/common/middlewares/image-upload.middleware";
import { updateBrandingBodySchema } from "../src/modules/organization/organization.validation";
import { slugify } from "../src/modules/organization/organization.service";
import { PNG_1X1 } from "./helpers";

describe("detectImageType", () => {
    it.each([
        ["png", PNG_1X1],
        ["jpg", Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0])],
        ["webp", Buffer.concat([Buffer.from("RIFF"), Buffer.alloc(4), Buffer.from("WEBPVP8 ")])],
        ["ico", Buffer.from([0, 0, 1, 0, 1, 0])],
    ])("recognises %s", (type, buf) => {
        expect(detectImageType(buf)).toBe(type);
    });

    it.each([
        ["svg", Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'/>")],
        ["html", Buffer.from("<html><script>alert(1)</script>")],
        ["empty", Buffer.alloc(0)],
        ["gif", Buffer.from("GIF89a")],
    ])("rejects %s", (_name, buf) => {
        expect(detectImageType(buf)).toBeNull();
    });
});

describe("updateBrandingBodySchema", () => {
    it("uppercases HEX colours and trims names", () => {
        expect(updateBrandingBodySchema.parse({ primaryColor: " #abcdef ", displayName: "  Acme  " })).toEqual({
            primaryColor: "#ABCDEF",
            displayName: "Acme",
        });
    });

    it("rejects unknown keys", () => {
        expect(() => updateBrandingBodySchema.parse({ organizationId: "x" })).toThrow();
    });
});

describe("slugify", () => {
    it("produces URL-safe slugs", () => {
        expect(slugify("Ünïcödé & Co., Ltd.")).toBe("unicode-co-ltd");
        expect(slugify("!!!")).toBe("org");
    });
});

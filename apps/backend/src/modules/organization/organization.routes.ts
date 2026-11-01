import { Router } from "express";
import authenticateUser from "../../common/middlewares/auth.middleware";
import validate from "../../common/middlewares/validate.middleware";
import { imageUpload } from "../../common/middlewares/image-upload.middleware";
import organizationController from "./organization.controller";
import { brandingAssetSchema, updateBrandingSchema, updateCareersSchema } from "./organization.validation";

// Mounted at /api/v1/organization. All routes act on the caller's own
// organization; authorization for writes is enforced in the service layer
// (owner or MANAGE_BRANDING permission).
const router = Router();

router.use(authenticateUser);

router.get("/workspace", organizationController.getWorkspace);

router.get("/branding", organizationController.getBranding);

router.get("/careers", organizationController.getCareersSettings);
router.put("/careers", validate(updateCareersSchema), organizationController.updateCareersSettings);

router.put("/branding", validate(updateBrandingSchema), organizationController.updateBranding);

router.post(
    "/branding/assets/:kind",
    validate(brandingAssetSchema),
    imageUpload.single("file"),
    organizationController.uploadBrandingAsset
);

router.delete(
    "/branding/assets/:kind",
    validate(brandingAssetSchema),
    organizationController.removeBrandingAsset
);

export default router;

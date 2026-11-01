import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import * as organizationService from "./organization.service";
import { BrandingAssetKind } from "./organization.constants";

// The tenant always comes from req.user (set by auth.middleware from the
// database). No handler reads an organization ID from params, query or body.
const actorFrom = (req: Request): organizationService.Actor => ({
    id: req.user!.id,
    role: req.user!.role,
    organizationId: req.user!.organizationId,
});

export const getWorkspace = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await organizationService.getWorkspace(actorFrom(req));
        return res.status(StatusCodes.OK).json({ success: true, message: "Workspace fetched successfully", data });
    } catch (error) {
        next(error);
    }
};

export const getBranding = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await organizationService.getBranding(req.user!.organizationId);
        return res.status(StatusCodes.OK).json({ success: true, message: "Branding fetched successfully", data });
    } catch (error) {
        next(error);
    }
};

export const updateBranding = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await organizationService.updateBranding(actorFrom(req), req.body);
        return res.status(StatusCodes.OK).json({ success: true, message: "Branding updated successfully", data });
    } catch (error) {
        next(error);
    }
};

export const uploadBrandingAsset = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const kind = req.params.kind as BrandingAssetKind;
        const data = await organizationService.uploadBrandingAsset(actorFrom(req), kind, req.file);
        return res.status(StatusCodes.OK).json({ success: true, message: `${kind === "logo" ? "Logo" : "Favicon"} uploaded successfully`, data });
    } catch (error) {
        next(error);
    }
};

export const removeBrandingAsset = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const kind = req.params.kind as BrandingAssetKind;
        const data = await organizationService.removeBrandingAsset(actorFrom(req), kind);
        return res.status(StatusCodes.OK).json({ success: true, message: `${kind === "logo" ? "Logo" : "Favicon"} removed`, data });
    } catch (error) {
        next(error);
    }
};

export const getPreferences = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await organizationService.getPreferences(req.user!.id);
        return res.status(StatusCodes.OK).json({ success: true, message: "Preferences fetched successfully", data });
    } catch (error) {
        next(error);
    }
};

export const updatePreferences = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await organizationService.updatePreferences(req.user!.id, req.body);
        return res.status(StatusCodes.OK).json({ success: true, message: "Preferences updated successfully", data });
    } catch (error) {
        next(error);
    }
};

export const getCareersSettings = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await organizationService.getCareersSettings(req.user!.organizationId);
        return res.status(StatusCodes.OK).json({ success: true, message: "Careers settings fetched", data });
    } catch (error) {
        next(error);
    }
};

export const updateCareersSettings = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await organizationService.updateCareersSettings(actorFrom(req), req.body);
        return res.status(StatusCodes.OK).json({ success: true, message: "Careers settings updated", data });
    } catch (error) {
        next(error);
    }
};

export default {
    getCareersSettings,
    updateCareersSettings,
    getWorkspace,
    getBranding,
    updateBranding,
    uploadBrandingAsset,
    removeBrandingAsset,
    getPreferences,
    updatePreferences,
};

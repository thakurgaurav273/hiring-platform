import { api } from "./axios";
import type {
  AppearanceMode,
  FontPreset,
  OrganizationBranding,
  RadiusPreset,
  SidebarStyle,
  ThemePresetId,
  Workspace,
} from "@/lib/theme/types";

export type BrandingAssetKind = "logo" | "favicon";

/** Fields an authorized admin may change. Assets are uploaded separately. */
export interface BrandingUpdate {
  displayName?: string | null;
  themePreset?: ThemePresetId;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  defaultAppearance?: AppearanceMode;
  sidebarStyle?: SidebarStyle;
  fontPreset?: FontPreset;
  radiusPreset?: RadiusPreset;
}

interface Envelope<T> {
  success: boolean;
  message: string;
  data: T;
}

// The organization is always resolved server-side from the session, so none
// of these calls send an organization ID.
export const organizationService = {
  getWorkspace: async (): Promise<Workspace> => {
    const { data } = await api.get<Envelope<Workspace>>("/organization/workspace");
    return data.data;
  },

  updateBranding: async (update: BrandingUpdate): Promise<OrganizationBranding> => {
    const { data } = await api.put<Envelope<OrganizationBranding>>("/organization/branding", update);
    return data.data;
  },

  uploadAsset: async (kind: BrandingAssetKind, file: File): Promise<OrganizationBranding> => {
    const form = new FormData();
    form.append("file", file);
    const { data } = await api.post<Envelope<OrganizationBranding>>(
      `/organization/branding/assets/${kind}`,
      form,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return data.data;
  },

  removeAsset: async (kind: BrandingAssetKind): Promise<OrganizationBranding> => {
    const { data } = await api.delete<Envelope<OrganizationBranding>>(`/organization/branding/assets/${kind}`);
    return data.data;
  },

  updatePreferences: async (appearance: AppearanceMode | null): Promise<{ appearance: AppearanceMode | null }> => {
    const { data } = await api.put<Envelope<{ appearance: AppearanceMode | null }>>("/users/me/preferences", {
      appearance,
    });
    return data.data;
  },
};

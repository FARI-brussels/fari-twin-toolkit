/**
 * Central type definitions for the Digital Twin Frontend
 */

import type { Component, FunctionalComponent } from 'vue';

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
}

// ============================================================================
// Backend Resource Record (shared structure for assets, tilesets, etc.)
// ============================================================================

export interface ResourceRecord {
  id: number;
  name: string;
  type: string;
  url: string;
  date: string;
  description: string;
  source: string;
  owner_id: number | null;
  filename: string;
  is_public: boolean;
  // Tileset-specific fields (from new TilesetManager)
  tileset_url?: string;
  files_base_url?: string;
  root_file?: string;
  file_count?: number;
}

// ============================================================================
// Asset Types
// ============================================================================

export interface Asset {
  id?: number;
  url: string;
  name: string;
  description?: string;
  type?: string;
  date?: string;
  owner_id?: number;
  is_public?: boolean;
}

// ============================================================================
// Map Layer Types
// ============================================================================

export interface MapLayer {
  url: string;
  layer: string;
  description: string;
  id?: number;
}

export interface GroupedLayers {
  [provider: string]: MapLayer[];
}

// ============================================================================
// Tileset Types
// ============================================================================

export interface Tileset {
  id?: number;
  url: string;
  name?: string;
  description?: string;
  date?: string;
}

// ============================================================================
// Dataset Types (Realtime)
// ============================================================================

export interface RealtimeDataset {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  type: string;
  url?: string; // Optional for compatibility with LibraryItem
}

// ============================================================================
// GeoJSON Types (Generic)
// ============================================================================

export interface GeoJSONPoint {
  type: 'Point';
  coordinates: [number, number] | [number, number, number];
}

export interface GeoJSONFeature<P = Record<string, unknown>> {
  type: 'Feature';
  id?: string | number;
  geometry: GeoJSONPoint;
  properties: P;
}

export interface GeoJSONFeatureCollection<P = Record<string, unknown>> {
  type: 'FeatureCollection';
  features: GeoJSONFeature<P>[];
}


// ============================================================================
// Demo/Example Types
// ============================================================================

export type LayerType = 'basemap' | 'tileset' | 'wms';

export interface ExampleLayer {
  id: string;
  name: string;
  type: LayerType;
  url?: string;
  layer?: string;
  enabled: boolean;
  style?: unknown;
}

export interface DemoExample {
  id: string;
  name: string;
  description: string;
  layers: ExampleLayer[];
  theme: {
    gradient: string;
    textColor: string;
    borderColor: string;
    icon: FunctionalComponent
  }
}

// ============================================================================
// LibraryBase Component Types
// ============================================================================

export type ItemType = 'asset' | 'map' | 'tileset' | 'dataset';
export type CodeLanguage = 'js' | 'unity' | 'react';

export type CodeSnippetGenerator<T> = (item: T) => string;

export interface CodeSnippets<T> {
  js?: CodeSnippetGenerator<T>;
  unity?: CodeSnippetGenerator<T>;
  react?: CodeSnippetGenerator<T>;
}

export interface LibraryItem {
  url?: string;
  id?: string | number;
  name?: string;
  description?: string;
  layer?: string;
}

export interface LibraryBaseProps<T extends LibraryItem = LibraryItem> {
  title: string;
  itemType: ItemType;
  fetchUrl?: string;
  deleteUrlBase?: string;
  viewerComponent: Component;
  uploadComponent?: Component;
  codeSnippets: CodeSnippets<T>;
  transformData?: (data: unknown[]) => T[];
  deleteItem?: (item: T) => Promise<void>;
  staticItems?: T[];
  customFetch?: () => Promise<ApiResponse<T[]>>;
}

// ============================================================================
// Keycloak Types
// ============================================================================

export interface KeycloakTokenParsed {
  name?: string;
  preferred_username?: string;
  email?: string;
  sub?: string;
  realm_access?: {
    roles: string[];
  };
  resource_access?: {
    [key: string]: {
      roles: string[];
    };
  };
}

export interface KeycloakInstance {
  token?: string;
  tokenParsed?: KeycloakTokenParsed;
  authenticated?: boolean;
  login: (options?: { redirectUri?: string }) => Promise<void>;
  logout: (options?: { redirectUri?: string }) => Promise<void>;
  register: (options?: { redirectUri?: string }) => Promise<void>;
  updateToken: (minValidity: number) => Promise<boolean>;
}


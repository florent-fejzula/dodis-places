export type Place = {
  id?: string;
  name: string;
  description?: string;
  gmapsUrl: string; // original link you pasted
  lat: number;
  lng: number;
  tags: string[]; // controlled chips
  createdAt?: any;
  updatedAt?: any;
  
  imagePrimaryUrl?: string; // default cover if no tag-specific match
  images?: Array<{
    url: string;
    tags: string[]; // tags this photo represents, e.g. ['dessert']
    weight?: number; // optional tie-break (higher wins)
  }>;
};
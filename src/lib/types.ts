export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
        };
        Update: {
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
        };
      };
      profile_settings: {
        Row: {
          id: string;
          profile_id: string;
          banner_image_url: string | null;
          bio: string | null;
          timezone: string;
          default_platforms: string[];
          notification_preferences: {
            email: boolean;
            push: boolean;
          };
          created_at: string;
          updated_at: string;
        };
        Insert: {
          profile_id: string;
          banner_image_url?: string | null;
          bio?: string | null;
          timezone?: string;
          default_platforms?: string[];
          notification_preferences?: {
            email: boolean;
            push: boolean;
          };
        };
        Update: {
          banner_image_url?: string | null;
          bio?: string | null;
          timezone?: string;
          default_platforms?: string[];
          notification_preferences?: {
            email: boolean;
            push: boolean;
          };
        };
      };
      // ... other table definitions
    };
  };
}
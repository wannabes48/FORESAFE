export interface Tag {
    tag_id: string
    whatsapp_number: string | null
    is_registered: boolean
    created_at?: string
}

export type Database = {
    public: {
        Tables: {
            tags: {
                Row: Tag
                Insert: Tag
                Update: Partial<Tag>
            }
        }
    }
}

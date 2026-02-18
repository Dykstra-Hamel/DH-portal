// Starred Items Types

export type StarredItemType = 'project' | 'task';

export interface StarredItem {
  id: string;
  user_id: string;
  item_type: StarredItemType;
  item_id: string;
  created_at: string;
}

export interface CreateStarredItemRequest {
  item_type: StarredItemType;
  item_id: string;
}

export interface DeleteStarredItemRequest {
  item_type: StarredItemType;
  item_id: string;
}

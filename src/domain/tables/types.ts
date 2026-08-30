import { Order } from "@/domain/pos/types";

export type TableStatus =
  | "available"
  | "occupied"
  | "reserved"
  | "cleaning"
  | "disabled";

export type TableShape = "square" | "round" | "rectangle";

export type ReservationStatus =
  | "confirmed"
  | "seated"
  | "completed"
  | "cancelled"
  | "no_show";

export interface Floor {
  id: string;
  org_id: string;
  branch_id: string;
  name: string;
  sort_order: number;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

export interface TableItemExtended {
  id: string;
  org_id: string;
  branch_id: string;
  floor_id: string;
  location_id?: string;
  table_number: string;
  capacity: number;
  section?: string;
  floor_area?: string;
  pos_x: number;
  pos_y: number;
  shape: TableShape;
  status: TableStatus;
  merged_into_table_id?: string | null;
  created_at: string;
  updated_at: string;
  floor?: Floor | null;
  active_order?: Order | null;
}

export interface Reservation {
  id: string;
  org_id: string;
  branch_id: string;
  location_id?: string;
  table_id?: string | null;
  customer_id?: string | null;
  customer_name: string;
  customer_phone?: string | null;
  customer_email?: string | null;
  party_size: number;
  reservation_time: string;
  status: ReservationStatus;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  table?: TableItemExtended | null;
}

export interface CreateFloorInput {
  name: string;
  sort_order?: number;
}

export interface CreateTableInput {
  floor_id: string;
  table_number: string;
  capacity: number;
  shape: TableShape;
  floor_area?: string;
  pos_x?: number;
  pos_y?: number;
}

export interface UpdateTableInput {
  id: string;
  floor_id?: string;
  table_number?: string;
  capacity?: number;
  floor_area?: string;
  shape?: TableShape;
  status?: TableStatus;
  pos_x?: number;
  pos_y?: number;
}

export interface TransferOrderInput {
  from_table_id: string;
  to_table_id: string;
}

export interface MergeTablesInput {
  source_table_id: string;
  target_table_id: string;
}

export interface CreateReservationInput {
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  party_size: number;
  reservation_time: string;
  table_id?: string;
  notes?: string;
}

export enum AppView {
  HOME = 'HOME',
  LOGIN = 'LOGIN',
  SETUP_TABLE = 'SETUP_TABLE',
  SETUP_GAME_TYPE = 'SETUP_GAME_TYPE',
  SETUP_MODE = 'SETUP_MODE',
  SETUP_PLAYERS = 'SETUP_PLAYERS',
  SCOREBOARD = 'SCOREBOARD',
  HISTORY = 'HISTORY',
  PRACTICE = 'PRACTICE',
  ADMIN = 'ADMIN'
}

export enum GameType {
  CAROM = 'Carom',
  POOL = 'Pool'
}

export enum GameSubType {
  LIBRE = 'Libre',
  CAROM_1 = '1 Băng',
  CAROM_3 = '3 Băng',
  POOL_9 = '9 Bi',
  POOL_10 = '10 Bi',
  POOL_15 = '15 Bi',
  NONE = ''
}

export enum GameMode {
  QUICK = 'Nhanh',
  TIME = 'Thời gian',
  ELIMINATION = 'Loại trừ',
  COMPETITION = 'Thi đấu'
}

export interface Player {
  id: string;
  name: string;
  handicap?: number;
}

export interface MatchConfig {
  tableId: string;
  tableName: string;
  type: GameType;
  subType: GameSubType;
  mode: GameMode;
  players: Player[];
  targetScore?: number;
  innings?: number;
  hourlyRate?: number;
  cameraUrl?: string;
}

export interface MatchState {
  scores: number[];
  innings: number;
  currentPlayerIndex: number;
  history: { playerIndex: number, points: number, inning: number }[];
  startTime: number;
  timer: number;
  isPaused: boolean;
  highRuns: number[];
  averages: number[];
  currentRun: number;
}

export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  USER = 'USER'
}

export enum TableStatus {
  AVAILABLE = 'Trống',
  OCCUPIED = 'Đang chơi',
  MAINTENANCE = 'Bảo trì'
}

export interface RoleDefinition {
  id: string;
  name: string;
  key: string;
  color: string;
  description: string;
  permissions: string[];
  isSystem?: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  role: string;
  linkedTableId?: string;
  createdAt: any;
}

export interface BilliardTable {
  id: string;
  name: string;
  type: GameType;
  status: TableStatus;
  currentStart?: any; 
  matchData?: MatchState | null;
  cameraUrl?: string;
  currentConfig?: MatchConfig | null; // 👈 Quan trọng cho chuyển bàn
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  unit: string;
  category: 'Đồ uống' | 'Đồ ăn' | 'Khác';
  stock?: number;
  updatedAt?: any;
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export interface Order {
  id?: string;
  matchId?: string;
  tableId?: string;
  tableName?: string;
  items: {
    id: string;
    name: string;
    price: number;
    quantity: number;
  }[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'served' | 'paid' | 'merged';
  orderedBy?: string;
  note?: string;
  createdAt: any;
  createdBy?: string;
}
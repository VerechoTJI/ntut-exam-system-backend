import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  Index,
} from "sequelize-typescript";

export type ViolationType = "AlertResult" | "Application On Quit";

@Table({
  tableName: "violation_logs",
  timestamps: false,
})
export class ViolationLog extends Model<ViolationLog> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @Index
  @Column({ field: "student_id", type: DataType.STRING, allowNull: false })
  student_id!: string;

  @Column({ field: "time", type: DataType.DATE, allowNull: false })
  time!: Date;

  @Column({ field: "ip_address", type: DataType.STRING, allowNull: true })
  ipAddress!: string | null;

  @Column({ field: "type", type: DataType.STRING, allowNull: false })
  type!: ViolationType;

  @Column({ field: "messeage", type: DataType.STRING, allowNull: false })
  messeage!: string;

  @Column({ field: "is_ok", type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  isOk!: boolean;
}

export default ViolationLog;
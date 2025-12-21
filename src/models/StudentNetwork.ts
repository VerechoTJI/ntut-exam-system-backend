import { Table, Column, Model, DataType, Index } from "sequelize-typescript";

export type AlertType =
  | "duplicate ip devices"
  | "Try to quit the app"
  | "multiple users same ip";

@Table({
  tableName: "student_networks",
  timestamps: false,
})
export class StudentNetwork extends Model<StudentNetwork> {
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  uuid!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  studentID!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  name!: string;

  @Column({ type: DataType.STRING, allowNull: true, field: "mac_address" })
  macAddress!: string | null;

  @Column({ type: DataType.STRING, allowNull: true, field: "ip_address" })
  ipAddress!: string | null;

  @Column({ type: DataType.STRING, allowNull: false, field: "psk_key" })
  pskKey!: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false, field: "is_get_key", defaultValue: false })
  isGetKey!: boolean;
}
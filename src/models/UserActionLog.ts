import { Table, Column, Model, DataType } from "sequelize-typescript";

@Table({ tableName: "user_action_logs", timestamps: false })
export class UserActionLog extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  declare id: number;

  @Column({ type: DataType.DATE, defaultValue: DataType.NOW })
  declare timestamp: Date;

  @Column(DataType.STRING)
  declare student_ID: string;

  @Column(DataType.STRING)
  declare ip_address: string;

  @Column(DataType.STRING)
  declare mac_address: string;

  @Column(DataType.STRING)
  declare action_type: string;

  @Column(DataType.TEXT)
  declare details: string;
}

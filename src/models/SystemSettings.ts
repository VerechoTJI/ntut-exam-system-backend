import { Table, Column, Model, DataType } from "sequelize-typescript";
interface SystemSettingAttributes {
  id: number;
  name: string;
  value: string;
}

@Table({ tableName: "system_settings", timestamps: false })
export class SystemSettings extends Model<
  SystemSettingAttributes,
  Omit<SystemSettingAttributes, "id">
> {
  @Column({ primaryKey: true, autoIncrement: true })
  declare id: number;

  @Column(DataType.STRING)
  declare name: string;

  @Column(DataType.TEXT)
  declare value: string;
}

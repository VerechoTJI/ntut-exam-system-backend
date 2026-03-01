import { Table, Column, Model, DataType } from "sequelize-typescript";

interface MessageAttributes {
  id: number;
  type: string;
  message: string;
  createdAt: Date;
}

@Table({ tableName: "messages", timestamps: true, updatedAt: false })
export class Message extends Model<
  MessageAttributes,
  Omit<MessageAttributes, "id" | "createdAt">
> {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  declare id: number;

  @Column(DataType.STRING)
  declare type: string;

  @Column(DataType.TEXT)
  declare message: string;

  @Column(DataType.DATE)
  declare createdAt: Date;
}

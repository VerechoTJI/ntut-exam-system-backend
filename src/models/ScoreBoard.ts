import { Table, Column, Model, DataType } from "sequelize-typescript";

@Table({ tableName: "score_boards", timestamps: false })
export class ScoreBoard extends Model {
  @Column({ primaryKey: true, autoIncrement: true })
  declare id: number;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  declare student_ID: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare student_name: string;

  @Column({ type: DataType.DATE, allowNull: true })
  declare last_submit_time: Date | null;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  declare subtask_amount: number;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  declare passed_subtask_amount: number;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  declare puzzle_amount: number;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  declare passed_puzzle_amount: number;

  @Column({
    type: DataType.JSON,
    allowNull: false,
    defaultValue: {},
  })
  declare puzzle_results: Record<string, boolean>;
}

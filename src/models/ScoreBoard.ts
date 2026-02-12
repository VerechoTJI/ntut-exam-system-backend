import { Table, Column, Model, DataType } from "sequelize-typescript";

@Table({ tableName: "score_boards", timestamps: false })
export class ScoreBoard extends Model {
  @Column({ primaryKey: true, autoIncrement: true })
  declare id: number;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  student_ID!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  student_name!: string;

  @Column({ type: DataType.DATE, allowNull: true })
  last_submit_time!: Date | null;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  subtask_amount!: number;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  passed_subtask_amount!: number;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  puzzle_amount!: number;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  passed_puzzle_amount!: number;

  @Column({
    type: DataType.JSON,
    allowNull: false,
    defaultValue: {},
  })
  puzzle_results!: Record<string, boolean>;
}

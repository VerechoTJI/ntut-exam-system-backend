import { ScoreBoard } from "../models/ScoreBoard";
import { ScoreBoardFormat } from "../types/scoreboard.type";
import { getPassedPuzzleAmount } from "../utils/scoreboard.util";

export class ScoreBoardService {
  /**
   * 1. 更新學生分數
   * 依據 student_ID 更新測資結果與通過數量，並自動更新最後提交時間
   */
  async updateStudentScore(input: ScoreBoardFormat, studentId: string) {
    try {
      const {
        passedPuzzleAmount,
        puzzleAmount,
        subtaskAmount,
        passedSubtaskAmount,
      } = getPassedPuzzleAmount(input);
      const [updatedRows] = await ScoreBoard.update(
        {
          student_ID: studentId,
          passed_puzzle_amount: passedPuzzleAmount, // 以通過的題目數量作為分數
          puzzle_amount: puzzleAmount,
          subtask_amount: subtaskAmount,
          passed_subtask_amount: passedSubtaskAmount,
          last_submit_time: new Date(), // 更新最後提交時間
          puzzle_results: input, // 儲存最新的測資結果
        },
        {
          where: { student_ID: studentId },
        },
      );
      if (updatedRows === 0) {
        console.warn(`⚠️ 查無學號 ${studentId} 的資料，無法更新分數`);
        return false;
      }
      console.log(`✅ 學號 ${studentId} 分數更新成功`);
      return true;
    } catch (error) {
      console.error("❌ Update score failed:", error);
      throw error;
    }
  }

  /**
   * 2. 取得單一學生分數 by student_ID
   */
  async getScoreByStudentId(studentID: string): Promise<ScoreBoard | null> {
    try {
      const studentScore = await ScoreBoard.findOne({
        where: { student_ID: studentID },
        // 若只需要特定欄位，可以使用 attributes: [...]
      });

      if (!studentScore) {
        console.warn(`⚠️ 查無學號 ${studentID} 的資料`);
        return null;
      }

      return studentScore;
    } catch (error) {
      console.error("❌ Get student score failed:", error);
      throw error;
    }
  }

  /**
   * 3. 取得所有學生分數，依照學號由小到大排序
   */
  async getAllScores(): Promise<ScoreBoard[]> {
    try {
      const allScores = await ScoreBoard.findAll({
        order: [
          ["student_ID", "ASC"], // 依照學號升冪排序 (小 -> 大)
        ],
        // raw: true, // 如果你只想要純 JSON 物件而不是 Sequelize Instance，可以打開這個
      });
      return allScores;
    } catch (error) {
      console.error("❌ Get all scores failed:", error);
      throw error;
    }
  }

  async isStudentExist(studentID: string): Promise<boolean> {
    const student = await ScoreBoard.findOne({
      where: { student_ID: studentID },
    });
    return !!student;
  }
}
const scoreBoardService = new ScoreBoardService();
export default scoreBoardService;

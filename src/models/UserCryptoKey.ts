import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  Index,
} from "sequelize-typescript";
import { Col } from "sequelize/lib/utils";

interface UserCryptoKeyAttributes {
  uuid: string;
  createdAt: Date;
  studentID: string;
  aesKey: string;
  userSessionID: string;
  ipAddress: string;
  isActive: boolean;
}

@Table({
  tableName: "user_crypto_keys",
  timestamps: false,
})
export class UserCryptoKey extends Model<UserCryptoKeyAttributes>
  implements UserCryptoKeyAttributes {
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  declare uuid: string;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
    field: "created_at",
  })
  declare createdAt: Date;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: "student_id",
  })
  declare studentID: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    field: "aes_key",
  })
  declare aesKey: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: "user_session_id",
  })
  declare userSessionID: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: "ip_address",
  })
  declare ipAddress: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: "is_active",
  })
  declare isActive: boolean;
}

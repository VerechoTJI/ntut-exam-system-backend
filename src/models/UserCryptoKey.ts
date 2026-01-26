import {
    Table,
    Column,
    Model,
    DataType,
    PrimaryKey,
    AutoIncrement,
    Index,
} from "sequelize-typescript";
import { Col } from "sequelize/types/utils";

@Table({
    tableName: "user_crypto_keys",
    timestamps: false,
})

export class UserCryptoKey extends Model<UserCryptoKey> {
    @Column({
        primaryKey: true,
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
    })
    uuid!: string;

    @Column({
        type: DataType.DATE,
        allowNull: false,
        defaultValue: DataType.NOW,
        field: "created_at",
    })
    createdAt!: Date;

    @Column({
        type: DataType.STRING,
        allowNull: false,
        field: "student_id",
    })
    studentID!: string;

    @Column({
        type: DataType.TEXT,
        allowNull: false,
        field: "aes_key",
    })
    aesKey!: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
        field: "ip_address",
    })
    ipAddress!: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
        field: "user_session_id",
    })
    userSessionID!: string;
}
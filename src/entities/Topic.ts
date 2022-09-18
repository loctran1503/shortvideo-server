import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Video } from "./Video";

@Entity("topic")
export class Topic {
  @PrimaryGeneratedColumn("uuid")
  topicId: string;

  @Column({ unique: true })
  name: string;

  

  @ManyToMany(() => Video, (video) => video.topics)
  videos: Video[];

  @CreateDateColumn({ type: 'timestamptz'})
  createdAt: Date;
}

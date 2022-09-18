import {  Column, CreateDateColumn, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from "typeorm";
import { Topic } from "./Topic";


@Entity('video')
export class Video{
    @PrimaryGeneratedColumn("uuid")
    videoId:string;

    @Column({nullable:true})
    title?:string

    @Column()
    url:string

    @Column({default:0})
    downloadedCounting:number;

    @Column({default:"Chưa xác định"})
    source:string

    @Column()
    keyword:string

    @ManyToMany(() => Topic,topic => topic.videos)
    @JoinTable()
    topics: Topic[]


    @CreateDateColumn()
    createdAt:Date 
}
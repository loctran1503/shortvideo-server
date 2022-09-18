import {  Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";


@Entity('suggest')
export class Suggest{
    @PrimaryGeneratedColumn("uuid")
    suggestId:string;

    @Column()
    link:string

    @Column()
    email?:string;

    @CreateDateColumn()
    createdAt:Date 
}
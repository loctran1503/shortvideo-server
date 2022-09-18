import {  Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";


@Entity('admin')
export class Admin{
    @PrimaryGeneratedColumn("uuid")
    adminId:string;

    @Column({unique:true})
    account:string

    @CreateDateColumn()
    createdAt:Date 
}
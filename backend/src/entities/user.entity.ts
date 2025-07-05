import { Entity, PrimaryColumn, Column, OneToMany } from 'typeorm';
import { Post } from './post.entity';
import { Comment } from './comment.entity';

@Entity('users')
export class User {
  @PrimaryColumn('varchar', { length: 255 })
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  username!: string;

  @Column({ type: 'varchar', unique: true, length: 255 })
  email!: string;

  @Column('text')
  password!: string;

  @Column({ type: 'simple-json', nullable: true })
  tokens: string[] = [];

  @Column({ type: 'varchar', length: 500, nullable: true })
  profilePicture: string | null = null;

  @OneToMany(() => Post, post => post.user)
  posts: Post[];

  @OneToMany(() => Comment, comment => comment.user)
  comments: Comment[];
}

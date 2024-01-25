/* import {
  PrismaClient as PGClient,
  ApiUser as PGApiUser,
  Guild as PGGuild,
  Infraction as PGInfraction,
  User as PGUser,
  UserAction as PGUserAction
} from "../../prisma/gen/pg";
import {
  PrismaClient as MongoClient,
  ApiUser as MGApiUser,
  Guild as MGGuild,
  User as MGUser,
  UserAction as MGUserAction,
  Infraction as MGInfraction
} from "../../prisma/gen/mongo";
import {
  PrismaClient as SqliteClient,
  ApiUser as SqliteApiUser,
  Guild as SqliteGuild,
  User as SqliteUser,
  UserAction as SqliteUserAction,
  Infraction as SqliteInfraction
} from "../../prisma/gen/sqlite"; */
import * as PGConnector from "../../prisma/gen/pg";
import * as SQLiteConnector from "../../prisma/gen/sqlite";
import * as MongoConnector from "../../prisma/gen/mongo";
import * as MySQLConnector from "../../prisma/gen/mysql";

type DBConnector = MongoConnector.PrismaClient
  & PGConnector.PrismaClient
  & SQLiteConnector.PrismaClient
  & MySQLConnector.PrismaClient;

type DBInfraction = PGConnector.Infraction
  & MongoConnector.Infraction
  & SQLiteConnector.Infraction
  & MySQLConnector.Infraction;

type DBGuild = PGConnector.Guild
  & MongoConnector.Guild
  & SQLiteConnector.Guild
  & MySQLConnector.Guild;

type DBApiUser = PGConnector.ApiUser
  & MongoConnector.ApiUser
  & SQLiteConnector.ApiUser
  & MySQLConnector.ApiUser;

type DBUser = PGConnector.User
  & MongoConnector.User
  & SQLiteConnector.User
  & MySQLConnector.User;

type DBMember = PGConnector.Member
  & MongoConnector.Member
  & SQLiteConnector.Member
  & MySQLConnector.Member;

type DBUserAction = PGConnector.UserAction
  & MongoConnector.UserAction
  & SQLiteConnector.UserAction
  & MySQLConnector.UserAction;

type DBApiAction = PGConnector.ApiAction
  & MongoConnector.ApiAction
  & SQLiteConnector.ApiAction
  & MySQLConnector.ApiAction;

type DBInfractionAppeal = PGConnector.InfractionAppeal
  & MongoConnector.InfractionAppeal
  & SQLiteConnector.InfractionAppeal
  & MySQLConnector.InfractionAppeal;

export {
  DBInfraction,
  DBApiUser,
  DBGuild,
  DBUser,
  DBUserAction,
  DBApiAction,
  DBInfractionAppeal,
  DBMember
}

export default DBConnector

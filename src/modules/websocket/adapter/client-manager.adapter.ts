import { Injectable } from '@nestjs/common';
import { CONFIG } from 'src/config/env-config';
import Redis from 'ioredis';

@Injectable()
export class ClientManagerAdapter {
  private redisClient = new Redis(CONFIG.redisUrl);

  async getUser(userId: string) {
    return this.getData(userId, { client: null, rooms: [] });
  }

  async addUser(userId: string) {
    await this.setData(userId, { client: userId, rooms: [] });
  }

  async addToRoom(roomId: string, userId: string) {
    const members = await this.getMembersOnlineInRoom(roomId);
    const user = await this.getUser(userId);
    members.push(userId);
    user.rooms.push(roomId);

    await this.setData(roomId, { members });
    await this.setData(userId, { ...user });
  }

  async leaveRoom(roomId: string, userId: string) {
    const members = await this.getMembersOnlineInRoom(roomId);
    const updatedMembers = members.filter((member) => member !== userId);
    const user = await this.getUser(userId);
    const updatedRooms = user.rooms.filter((room) => room !== roomId);

    await this.setData(roomId, { members: updatedMembers });
    await this.setData(userId, { ...user, rooms: updatedRooms });
  }

  async getMembersOnlineInRoom(roomId: string): Promise<string[]> {
    const { members = [] } = await this.getData(roomId, { members: [] });

    return members;
  }

  async checkUserIsMemberOfRoom(
    roomId: string,
    userId: string,
  ): Promise<boolean> {
    const members = await this.getMembersOnlineInRoom(roomId);
    return members.includes(userId);
  }

  async disconnectUser(userId: string) {
    const user = await this.getUser(userId);

    await this.redisClient.del(userId);

    user.rooms.forEach(async (room) => {
      await this.leaveRoom(room, userId);
    });
  }

  private async getData(key: string, defaultIfNotFound = null): Promise<any> {
    const data = await this.redisClient.get(key);

    if (!data) {
      return defaultIfNotFound;
    }

    try {
      return JSON.parse(data);
    } catch (error) {
      return data;
    }
  }

  private async setData(key: string, value: any, raw = false) {
    await this.redisClient.set(key, !raw ? JSON.stringify(value) : value);
  }
}

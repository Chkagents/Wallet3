import { ContentType, ShardAcknowledgement, ShardDistribution } from './Constants';
import { computed, makeObservable, observable, runInAction } from 'mobx';

import { TCPClient } from '../../common/p2p/TCPClient';
import { createHash } from 'crypto';
import eccrypto from 'eccrypto';

export enum ShardTransferringStatus {
  ready = 0,
  sending,
  ackSucceed,
  ackFailed,
}

export class ShardSender {
  readonly socket: TCPClient;
  readonly distributionId: string;

  status = ShardTransferringStatus.ready;

  constructor({ socket, distributionId }: { socket: TCPClient; distributionId: string }) {
    this.socket = socket;
    this.distributionId = distributionId;
    makeObservable(this, { status: observable, closed: computed });
  }

  get closed() {
    return this.socket.closed;
  }

  get remoteInfo() {
    return this.socket.remoteInfo;
  }

  get remoteIP() {
    return this.socket.remoteIP;
  }

  get pairingCode() {
    return this.socket.pairingCode;
  }

  get greeted() {
    return this.socket.greeted;
  }

  sendPairingCode(code: string) {
    return this.secureWriteString(
      JSON.stringify({ type: ContentType.pairingCodeVerified, hash: createHash('sha256').update(code).digest('hex') })
    );
  }

  async sendShard(args: {
    threshold: number;
    rootShard: string;
    pubkey: string;
    signKey: string;
    bip32Shard: string;
    bip32Path: string;
    bip32PathIndex: number;
  }) {
    const { rootShard, signKey, bip32Shard: bip32XprivShard, pubkey } = args;
    runInAction(() => (this.status = ShardTransferringStatus.sending));

    const signKeyBuffer = Buffer.from(signKey, 'hex');

    const rootSignature = (await eccrypto.sign(signKeyBuffer, createHash('sha256').update(rootShard).digest())).toString(
      'hex'
    );

    const bip32Signature = (
      await eccrypto.sign(signKeyBuffer, createHash('sha256').update(bip32XprivShard).digest())
    ).toString('hex');

    return this.secureWriteString(
      JSON.stringify({
        type: ContentType.shardDistribution,
        pubkey,
        distributionId: this.distributionId,
        secrets: { rootShard: args.rootShard, rootSignature, bip32Shard: args.bip32Shard, bip32Signature },
        secretsInfo: { bip32Path: args.bip32Path, bip32PathIndex: args.bip32PathIndex, threshold: args.threshold },
      } as ShardDistribution)
    );
  }

  async readShardAck() {
    const data = (await this.secureReadString())!;
    console.log('shard ack received:', data);

    try {
      const ack = JSON.parse(data) as ShardAcknowledgement;

      const success = ack.distributionId === this.distributionId && ack.success;
      runInAction(() => (this.status = success ? ShardTransferringStatus.ackSucceed : ShardTransferringStatus.ackFailed));

      return success;
    } catch (error) {
      runInAction(() => (this.status = ShardTransferringStatus.ackFailed));
    }

    return false;
  }

  secureWriteString(data: string, encoding?: BufferEncoding) {
    return this.socket.secureWriteString(data, encoding);
  }

  secureReadString(encoding?: BufferEncoding) {
    return this.socket.secureReadString(encoding);
  }

  destroy() {
    this.socket.destroy();
  }
}

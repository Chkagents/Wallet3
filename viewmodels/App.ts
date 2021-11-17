import { computed, makeObservable, observable, runInAction } from 'mobx';

import Authentication from './Authentication';
import Coingecko from '../common/apis/Coingecko';
import DAppHub from './DAppHub';
import Database from '../models/Database';
import TxHub from './TxHub';
import { Wallet } from './Wallet';

export class AppVM {
  initialized = false;
  wallets: Wallet[] = [];
  currentWallet?: Wallet = undefined;

  get hasWallet() {
    return this.wallets.length > 0;
  }

  constructor() {
    makeObservable(this, {
      initialized: observable,
      wallets: observable,
      currentWallet: observable,
      hasWallet: computed,
    });
  }

  async init() {
    Coingecko.init();

    await Promise.all([Database.init(), Authentication.init()]);
    await Promise.all([TxHub.init(), DAppHub.init()]);

    const wallets = await Promise.all((await Database.keyRepository.find()).map((key) => new Wallet(key).init()));

    runInAction(() => {
      this.initialized = true;
      this.wallets = wallets;
      this.currentWallet = wallets[0];
    });
  }

  dispose() {
    Database.dispose();
  }
}

export default new AppVM();

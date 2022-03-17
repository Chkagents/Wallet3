import AsyncStorage from '@react-native-async-storage/async-storage';
import { ERC20Token } from '../../models/ERC20';
import { IToken } from '../../common/Tokens';
import LINQ from 'linq';
import Networks from '../Networks';
import { utils } from 'ethers';

export interface UserToken extends IToken {
  order?: number;
  shown?: boolean;
}

export default class TokensMan {
  static async saveUserTokens(chainId: number, account: string, allTokens: UserToken[]) {
    const plainTokens = allTokens.map<UserToken>((t, i) => {
      return {
        address: t.address,
        decimals: t.decimals,
        symbol: t.symbol,
        iconUrl: t.iconUrl,
        order: i + 1,
        shown: t.shown,
      };
    });

    await AsyncStorage.setItem(`${chainId}-${account}`, JSON.stringify(plainTokens));
  }

  static async loadUserTokens(chainId: number, account: string) {
    const popTokens = Networks.find(chainId)?.defaultTokens ?? [];
    const customized: UserToken[] = JSON.parse((await AsyncStorage.getItem(`${chainId}-${account}`)) || '[]');

    const tokens: UserToken[] = customized.length === 0 ? popTokens : customized;
    return LINQ.from(tokens)
      .orderBy((t) => t.order || 0)
      .select((t) => new ERC20Token({ ...t, owner: account, chainId, contract: utils.getAddress(t.address) }))
      .distinct((t) => t.address)
      .toArray();
  }
}

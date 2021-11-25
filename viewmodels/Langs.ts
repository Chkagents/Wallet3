import { action, makeObservable, observable, runInAction } from 'mobx';

import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../i18n';

export interface Lang {
  flag: string;
  name: string;
  value: string;
}

class Langs {
  currentLang: Lang;

  supportedLangs: Lang[] = [
    { flag: 'usa', name: 'English', value: 'en' },
    { flag: 'jp', name: '日本語', value: 'jp' },
    { flag: 'tw', name: '繁体中文', value: 'zh-tw' },
    { flag: 'cn', name: '简体中文', value: 'zh-cn' },
  ];

  constructor() {
    this.currentLang = this.supportedLangs[0];
    i18n.locale = this.currentLang.value;

    makeObservable(this, { currentLang: observable, setLang: action });

    AsyncStorage.getItem('lang').then((lang) => {
      if (!lang) return;
      const defaultLang = this.supportedLangs.find((l) => l.value === lang) || this.supportedLangs[0];
      runInAction(() => (this.currentLang = defaultLang));
      i18n.locale = this.currentLang.value;
    });
  }

  setLang(lang: Lang) {
    this.currentLang = lang;
    i18n.locale = this.currentLang.value;
    AsyncStorage.setItem('lang', lang.value);
  }
}

export default new Langs();

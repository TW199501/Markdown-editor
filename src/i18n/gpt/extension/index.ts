import {registerKeyset} from '../../i18n';

import en from './en.json';
import ru from './ru.json';
import zhTw from './zh-TW.json';

export const i18n = registerKeyset('gpt', {en, ru, 'zh-TW': zhTw});

export type I18nKey = Parameters<typeof i18n>[0];

import { getUserData } from './utils.js';

const { tg } = getUserData();
tg.expand();
tg.enableClosingConfirmation();

// Главная страница остается пустой, ничего не делаем
console.log('Главная страница');
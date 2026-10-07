# Carton Shop — запуск

## 1. Перенеси свой `.env`

Не используй `.env` из исходного архива, если его там нет. Создай `.env` по образцу `.env.example` и укажи свои значения `DATABASE_URL`, `DIRECT_URL` и `SESSION_SECRET`.

Для ручного пополнения добавь в `.env`:

```env
TOPUP_SBP_PHONE=+7XXXXXXXXXX
TOPUP_SBP_RECIPIENT=Имя получателя
TOPUP_TBANK_CARD=0000 0000 0000 0000
TOPUP_INSTRUCTIONS=После перевода создай заявку на сайте.
```

Не указывай CVV, пароли или коды из SMS.

## 2. Установка

```powershell
cd "C:\Users\tik57\OneDrive\Desktop\carton-shop"
npm.cmd install
npm.cmd run dev
```

## 3. Ручные пополнения

Пользователь открывает `/balance`, переводит деньги по указанным реквизитам и нажимает «Я перевёл деньги — создать заявку».

Администратор открывает `/admin`, проверяет перевод и нажимает «Зачислить» или «Отклонить».

Таблица `TopUp` создаётся приложением автоматически при первом обращении к системе. Для ручного создания есть `add-topups.sql`.


### Новая схема пополнения

На странице `/balance` пользователь выбирает сумму, после чего сайт сразу показывает точную сумму к переводу и реквизиты получателя. После нажатия «Я перевёл деньги — создать заявку» создаётся заявка с уникальным номером вида `CS-XXXXXXXX`. Администратор видит этот номер в `/admin` и вручную проверяет поступление денег перед зачислением.

Таблица `TopUp`, поле `reference` и поле `paymentMethod` создаются/обновляются автоматически при первом обращении к системе пополнения. Для ручного SQL есть обновлённый `add-topups.sql`.

## Profile avatars

The latest version adds user profile avatars. The first upload creates the `User.avatarUrl` column automatically. Users can upload JPG/PNG/WEBP files up to 3 MB from `/profile`; files are stored under `public/uploads/avatars`.

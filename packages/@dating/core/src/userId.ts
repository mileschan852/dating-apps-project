let _userId: number | null = null
export function setTelegramUserId(id: number) { _userId = id }
export function getTelegramUserId(): number | null { return _userId }

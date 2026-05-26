const KEY = "daemon_guest_mode"

export const setGuestMode = () => sessionStorage.setItem(KEY, "1")
export const clearGuestMode = () => sessionStorage.removeItem(KEY)
export const isGuestMode = () => sessionStorage.getItem(KEY) === "1"

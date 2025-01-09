const dateTime = () => {
    const date = `${String(new Date().getDate()).padStart(2, "0")}`
    const month = `${String(new Date().getMonth()+1).padStart(2, "0")}`
    const year = `${String(new Date().getFullYear())}`
    const hours = `${String(new Date().getHours())}`
    const minute = `${String(new Date().getMinutes())}`
    const second = `${String(new Date().getSeconds())}`
    return `${year}-${month}-${date} ${hours}:${minute}:${second}`
}

const date = () => {
    const date = `${String(new Date().getDate()).padStart(2, "0")}`
    const month = `${String(new Date().getMonth()+1).padStart(2, "0")}`
    const year = `${String(new Date().getFullYear())}`
    return `${year}-${month}-${date}`
} 

module.exports = {dateTime, date};
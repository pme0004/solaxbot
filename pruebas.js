var start_date = new Date();
start_date.setHours(1 , 0, 0, 0);
var start_date_iso=start_date.toISOString();
var end_date = new Date();
end_date.setHours(24, 59, 59, 999);
var end_date_iso= end_date.toISOString(0);
console.log("la fecha es "+ start_date_iso + "   y   "+end_date_iso);
function f(to){
	var months = [31,28,31,30,31,30,31,31,30,31,30,31];
	var now = moment();
  	var s = (60+to.second()-now.second())%60;
    var m = (60+to.minute()-now.minute()-(to.second()<now.second()?1:0))%60;
    var h = (24+to.hour()-now.hour()-(to.minute()<now.minute()?1:0))%24;
    var n = months[now.month()];
    var D = (n+to.date()-now.date()-(to.hour()<now.hour()?1:0))%n;
    var M = (12+to.month()-now.month()-(to.day()<now.day()?1:0))%12;
    var Y = to.year()-now.year()-(to.month()<now.month()?1:0);
    s += s==1 ? " secondo" : " secondi";
    m += m==1 ? " minuto, " : " minuti, ";
    h += h==1 ? " ora, " : " ore, ";
    D += D==1 ? " giorno, " : " giorni, ";
    M += M==1 ? " mese, " : " mesi, ";
    Y += Y==1 ? " anno, " : " anni, ";
    return Y+M+D+h+m+s;
}

window.onload = function () {
   	var to = moment('2028-09-21 20:15:00');
    document.querySelector('#time').textContent = f(to);
    var asd = setInterval(function(){
      	document.querySelector('#time').textContent = f(to);
    },1000);
};
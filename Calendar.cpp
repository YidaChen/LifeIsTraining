// Calendar
// part1: caculate distance from reference day
// part2: print calendar


#include<iostream>
#include<iomanip>    // for setw()

using std::cout;
using std::cin;
using std::endl;
using std::setw;

bool isLeapYear(int year){
	if((year%400 == 0)||((year%4 == 0)&&(year%100 != 0))){
		return true;
	}
	else{
		return false;
	}
}

void dayFromYear(int year, int &daycount){
    // int day = 0;
    
    // method1: scan, reference: 2006
    if(year > 2006){
	    for(int i = 2006; i < year; i++){
	    	if(isLeapYear(i)){
	    		daycount += 366;
	    	}
	    	else{
	    		daycount += 365;
	    	}
	    }
	}
	else{
		for(int i = 2005; i > year; i--){
			if(isLeapYear(i)){
				daycount += 366;
			}
			else{
				daycount += 365;
			}
		}
	}
}

void dayFromMonth(int year, int month, int &daycount){

	// method1: scan
	if(year > 2006){
	    for(int i = 1; i < month; i++){
	        if((i==4) || (i==6) || (i==9) || (i==11)){
	        	daycount += 30;
	        }
	    	else if(i==2){
	    		if(isLeapYear(year)){
	    			daycount += 29;
	    		}
	    		else{
	    			daycount += 28;
	    		}
	    	}
	    	else{
	    		daycount += 31;
	    	}
	    }
	}
	else{
		for(int i = 12; i >= month; i--){
			if((i==4) || (i==6) || (i==9) || (i==11)){
	        	daycount += 30;
	        }
	    	else if(i==2){
	    		if(isLeapYear(year)){
	    			daycount += 29;
	    		}
	    		else{
	    			daycount += 28;
	    		}
	    	}
	    	else{
	    		daycount += 31;
	    	}
		}
	}
}

int weekDayOfFirstDay(int year, int month){

	// 方法一：設counter, 從ref慢慢數到input的年月, 計算經過了幾個月, 期間有沒有閏年
	// 方法二：
   
	int distance = 0;
    dayFromYear(year, distance);           // 和 2006 差幾年, 並考慮閏年, 計算差幾天
    dayFromMonth(year, month, distance);   // 和 1月 差幾個月, 要考慮閏月, 計算差幾天
    if(year > 2006){
		return (distance % 7);   // 回傳month月1號是星期幾
	}
	else{
		return (7-(distance%7))%7;
	}
}

void printCalendar(int year, int month){
	// 該月分要印幾個數
	int dayLength = 31;
	if ((month == 4)||(month == 6)||(month == 9)||(month == 11)){
		dayLength = 30;
	}
	else if(month == 2){
		if(isLeapYear(year)){
			dayLength = 29;
		}
		else{
			dayLength = 28;
		}
	}

	// dayDistance算出來的就是input的month的第一天的"星期"
	// 0:sunday ~ 6:saturday
	int weekDay = weekDayOfFirstDay(year, month);   
	dayLength += weekDay;   // 把padding " " 的位置算進去

	// 先印 Sun Mon Tue ...., 再印日期
	
	cout << setw(4) << "Sun" << setw(4) << "Mon" << setw(4) << "Tue"
		 << setw(4) << "Wed" << setw(4) << "Thu" << setw(4) << "Fri"
		 << setw(4) << "Sat" << endl;  
	for(int i = 1; i <= dayLength; i++){
		if(i <= weekDay){
			cout << setw(4) << " ";
		}
		else{
			cout << setw(4) << (i-weekDay);
		}
		if(i%7 == 0){
			cout << endl;
		}
	}
	cout << endl;
}

int main(){

	int year = 0, month = 0;
	
	cout << "Enter year:\n";
	cin >> year;
	cout << "Enter month:\n";
	cin >> month;
    if(isLeapYear(year)){
    	cout << year << " is leap year.\n";
    }
    else{
    	cout << year << " is not leap year.\n";
    }
	printCalendar(year, month);

	return 0;
}
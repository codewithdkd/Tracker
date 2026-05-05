function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var user = data.user;
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(user);
    
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({"error": "Sheet not found for user: " + user})).setMimeType(ContentService.MimeType.JSON);
    }
    
    // NEW SCHEMA (25 Columns)
    // 0.Date | 1.Points | 2.Weight | 3.Height | 4.Age | 5.Exercise JSON | 6.Burnt | 7.Food JSON | 8.Consumed | 9.Water | 10.Junk Food | 11.Sugar | 12.FruitsJuice | 13.Sleep Time | 14.Wake Time | 15.Sleep Hours | 16.Left Home | 17.Returned Home | 18.Study Hours | 19.Phone Hours | 20.No Phone Morning | 21.Sunlight | 22.Meditation | 23.Mood | 24.Anger
    
    var rowData = [
      data.date,
      data.points,
      data.weight || "",
      data.height || "",
      data.age || "",
      data.exerciseJSON || "[]",
      data.totalCalories || 0,
      data.foodJSON || "[]",
      data.totalFoodCalories || 0,
      data.water,
      data.junkFood,
      data.sugar,
      data.fruitsJuice,
      data.sleepTime,
      data.wakeTime,
      data.sleepHours,
      data.leftHome,
      data.returnedHome,
      data.studyHours,
      data.phoneHours,
      data.noPhoneMorning,
      data.sunlight,
      data.meditation,
      data.mood,
      data.anger || "No"
    ];
    
    sheet.appendRow(rowData);
    
    return ContentService.createTextOutput(JSON.stringify({"status": "Success"})).setMimeType(ContentService.MimeType.JSON);
  } catch(error) {
    return ContentService.createTextOutput(JSON.stringify({"error": error.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  var action = e.parameter.action;
  
  if (action === "getStandings") {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var dSheet = ss.getSheetByName("Deepak");
    var sSheet = ss.getSheetByName("Shalini");
    var dbSheet = ss.getSheetByName("CalorieDB");
    
    var dData = processSheetData(dSheet);
    var sData = processSheetData(sSheet);
    
    var foodDB = [];
    var exerciseDB = {};
    
    if (dbSheet) {
      var dbVals = dbSheet.getDataRange().getValues();
      // Skip header row
      for (var j = 1; j < dbVals.length; j++) {
        // Food: A(0)=Name, B(1)=Cals, C(2)=Qty, D(3)=Unit
        if (dbVals[j][0]) {
          foodDB.push({
            name: String(dbVals[j][0]).toLowerCase().trim(),
            cals: parseFloat(dbVals[j][1]) || 0,
            qty: parseFloat(dbVals[j][2]) || 1,
            unit: String(dbVals[j][3] || "piece").toLowerCase().trim()
          });
        }
        // Exercise: F(5)=Name, G(6)=MET
        if (dbVals[j][5]) {
          var exName = String(dbVals[j][5]).toLowerCase().trim();
          exerciseDB[exName] = parseFloat(dbVals[j][6]) || 0;
        }
      }
    }
    
    // Merge monthly history
    var monthlyMap = {};
    
    for (var key in dData.monthly) {
      var item = dData.monthly[key];
      monthlyMap[key] = { monthName: item.monthName, deepak: item.points, shalini: 0, sortKey: key };
    }
    
    for (var key in sData.monthly) {
      var item = sData.monthly[key];
      if (!monthlyMap[key]) {
        monthlyMap[key] = { monthName: item.monthName, deepak: 0, shalini: item.points, sortKey: key };
      } else {
        monthlyMap[key].shalini = item.points;
      }
    }
    
    var monthlyArray = [];
    for (var k in monthlyMap) {
      monthlyArray.push(monthlyMap[k]);
    }
    
    // Sort descending by sortKey (YYYY-MM)
    monthlyArray.sort(function(a, b) {
      return b.sortKey.localeCompare(a.sortKey);
    });
    
    return ContentService.createTextOutput(JSON.stringify({
      "deepakTotal": dData.currentTotal,
      "shaliniTotal": sData.currentTotal,
      "deepakEntries": dData.currentEntries,
      "shaliniEntries": sData.currentEntries,
      "deepakWeight": dData.weight,
      "deepakHeight": dData.height,
      "deepakAge": dData.age,
      "deepakLogs": dData.dailyLogs,
      "shaliniWeight": sData.weight,
      "shaliniHeight": sData.height,
      "shaliniAge": sData.age,
      "shaliniLogs": sData.dailyLogs,
      "pastMonths": monthlyArray,
      "pastFoods": dData.pastFoods.concat(sData.pastFoods).filter(function(item, pos, self) {
          return self.indexOf(item) == pos;
      }),
      "foodDB": foodDB,
      "exerciseDB": exerciseDB
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService.createTextOutput("Habit Tracker Backend Running. Make a POST request to add data, or GET with ?action=getStandings to retrieve points.");
}

function processSheetData(sheet) {
  if (!sheet) return { currentTotal: 0, currentEntries: 0, monthly: {}, pastFoods: [], weight: 0, height: 0, age: 0, dailyLogs: [] };
  
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { currentTotal: 0, currentEntries: 0, monthly: {}, pastFoods: [], weight: 0, height: 0, age: 0, dailyLogs: [] };
  
  var currentTotal = 0;
  var currentEntries = 0;
  var monthly = {};
  var foodsSet = {};
  var currentMonth = new Date().getMonth();
  var currentYear = new Date().getFullYear();
  var currentWeight = 70;
  var currentHeight = 170;
  var currentAge = 25;
  var dailyLogs = [];
  
  // Date is Column A (index 0)
  for (var i = 1; i < data.length; i++) {
    var dateVal = data[i][0];
    if(dateVal) {
      var rowDate = new Date(dateVal);
      var points = parseFloat(data[i][1]);
      if(isNaN(points)) points = 0;
      
      var w = parseFloat(data[i][2]);
      if(w) currentWeight = w;
      var h = parseFloat(data[i][3]);
      if(h) currentHeight = h;
      var a = parseInt(data[i][4], 10);
      if(a) currentAge = a;
      
      var sortKey = Utilities.formatDate(rowDate, Session.getScriptTimeZone(), "yyyy-MM");
      var monthName = Utilities.formatDate(rowDate, Session.getScriptTimeZone(), "MMMM yyyy");
      
      if (!monthly[sortKey]) {
        monthly[sortKey] = { monthName: monthName, points: 0 };
      }
      monthly[sortKey].points += points;
      
      if (rowDate.getMonth() === currentMonth && rowDate.getFullYear() === currentYear) {
        currentTotal += points;
        currentEntries += 1;
        
        var dateKey = Utilities.formatDate(rowDate, Session.getScriptTimeZone(), "yyyy-MM-dd");
        var burnt = parseFloat(data[i][6]) || 0; 
        var consumed = parseFloat(data[i][8]) || 0; 
        
        // Aggregate if multiple entries per day
        var found = false;
        for (var k = 0; k < dailyLogs.length; k++) {
            if (dailyLogs[k].date === dateKey) {
                dailyLogs[k].burnt += burnt;
                dailyLogs[k].consumed += consumed;
                found = true;
                break;
            }
        }
        if (!found) {
            dailyLogs.push({ date: dateKey, burnt: burnt, consumed: consumed });
        }
      }
      
      // Parse past foods
      var foodStr = data[i][7];
      if (foodStr) {
        try {
          var arr = JSON.parse(foodStr);
          for (var j=0; j<arr.length; j++) {
            if (arr[j].name) {
              var fn = arr[j].name.trim();
              if (fn) foodsSet[fn] = true;
            }
          }
        } catch(e) {}
      }
    }
  }
  
  var pastFoodsList = [];
  for (var k in foodsSet) pastFoodsList.push(k);
  
  return {
    currentTotal: currentTotal,
    currentEntries: currentEntries,
    monthly: monthly,
    pastFoods: pastFoodsList,
    weight: currentWeight,
    height: currentHeight,
    age: currentAge,
    dailyLogs: dailyLogs
  };
}

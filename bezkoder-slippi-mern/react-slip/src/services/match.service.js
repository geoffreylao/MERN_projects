import http from "../http-common";

class MatchDataService{
  getAll() {
    return http.get("/matches");
  }

  create(data) {
    return http.post("/matches", data);
  }

  findByCode(searchParamString){
    console.log(searchParamString);
    return http.get(`matches?${searchParamString}`);
  }
}

export default new MatchDataService();
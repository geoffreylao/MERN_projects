import http from "../http-common";

class MatchDataService{
  getAll() {
    return http.get("/matches");
  }

  create(data) {
    return http.post("/matches", data);
  }

  findByCode(code, oppcode){
    return http.get(`/matches?code=${code}&oppcode=${oppcode}`);
  }
}

export default new MatchDataService();
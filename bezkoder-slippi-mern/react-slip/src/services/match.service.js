import http from "../http-common";

class MatchDataService{
  getAll() {
    return http.get("/matches");
  }

  create(data) {
    return http.post("/matches", data);
  }

  findByCode(code){
    return http.get(`/matches?code=${code}`);
  }
}

export default new TutorialDataService();
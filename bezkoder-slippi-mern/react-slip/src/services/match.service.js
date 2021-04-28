import http from "../http-common";

class MatchDataService{
  getAll() {
    return http.get("/matches");
  }

  create(data) {
    return http.post("/matches", data);
  }

  findByCode(code, oppcode, character, stage, complete, start, end){
    return http.get(`/matches?code=${code}&oppcode=${oppcode}&character=${character}&stage=${stage}&complete=${complete}&start=${start}&end=${end}`);
  }
}

export default new MatchDataService();
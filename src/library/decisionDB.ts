import axios from "axios";
import { DBSDER_API_URL } from "./env";

export function sendToSder(decision: any /* UnIdentifiedDecisionCph */) {
  return axios.post(DBSDER_API_URL, decision);
}

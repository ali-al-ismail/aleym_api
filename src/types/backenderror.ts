export type BackendError =
  | { Database: string }
  | "InvalidWeightsSum"
  | { InvalidPercentage: number }
  | { InvalidJsonParameters: string }
  | { Storage: string }
  | { Network: string }
  | { InvalidInformantParameters: string }
  | { RssParsingError: string }
  | { TelegramParsingError: string }
  | { Informant: string }
  | { Internal: string };
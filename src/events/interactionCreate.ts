import { ArgsOf, Discord, On } from "discordx";
import { client } from "../index.js";

@Discord()
class interactionCreate {
  @On({
    event: "interactionCreate"
  })
  private onInteraction (
    [interaction]: ArgsOf<"interactionCreate">
  ) {
    client.executeInteraction(interaction);
  }
}

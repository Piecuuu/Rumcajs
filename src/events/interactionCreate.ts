import { ArgsOf, Discord, On } from "discordx";
import { client } from "..";

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

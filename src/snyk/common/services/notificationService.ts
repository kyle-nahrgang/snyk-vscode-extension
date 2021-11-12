import { snykMessages } from '../../base/messages/snykMessages';
import { errorType } from '../../base/modules/interfaces';
import { messages as ossMessages } from '../../snykOss/messages/test';
import { IAnalytics } from '../analytics/itly';
import { IConfiguration } from '../configuration/configuration';
import { VSCODE_VIEW_CONTAINER_COMMAND, VSCODE_VIEW_OSS_VIEW_COMMAND } from '../constants/commands';
import { errorsLogs } from '../messages/errorsServerLogMessages';
import { IVSCodeCommands } from '../vscode/commands';
import { IVSCodeWindow } from '../vscode/window';

export interface INotificationService {
  init(errorHandler: (error: errorType, options: { [key: string]: any }) => Promise<void>): Promise<void>;
  showErrorNotification(message: string): Promise<void>;
  showOssBackgroundScanNotification(newVulnerabilityCount: number): Promise<void>;
}

export class NotificationService implements INotificationService {
  constructor(
    private readonly window: IVSCodeWindow,
    private readonly commands: IVSCodeCommands,
    private readonly configuration: IConfiguration,
    private readonly analytics: IAnalytics,
  ) {}

  async init(errorHandler: (error: errorType, options: { [key: string]: any }) => Promise<void>): Promise<void> {
    await this.checkWelcomeNotification().catch(err =>
      errorHandler(err, {
        message: errorsLogs.welcomeNotification,
      }),
    );
  }

  private async checkWelcomeNotification(): Promise<void> {
    if (!this.configuration.shouldShowWelcomeNotification) {
      return;
    }

    const pressedButton = await this.window.showInformationMessage(
      snykMessages.welcome.msg,
      snykMessages.welcome.button,
    );

    if (pressedButton === snykMessages.welcome.button) {
      await this.commands.executeCommand(VSCODE_VIEW_CONTAINER_COMMAND);
      this.analytics.logWelcomeButtonIsClicked();
    }

    await this.configuration.hideWelcomeNotification();
  }

  async showErrorNotification(message: string): Promise<void> {
    await this.window.showErrorMessage(message);
  }

  async showOssBackgroundScanNotification(newVulnerabilityCount: number): Promise<void> {
    const pressedButton = await this.window.showInformationMessage(
      ossMessages.newCriticalVulnerabilitiesFound(newVulnerabilityCount),
      ossMessages.viewResults,
      ossMessages.hide,
    );

    if (pressedButton === ossMessages.viewResults) {
      await this.commands.executeCommand(VSCODE_VIEW_OSS_VIEW_COMMAND);
    } else if (pressedButton === ossMessages.hide) {
      await this.configuration.hideOssBackgroundScanNotification();
    }
  }
}

/**
 * Enables  the sharing of a URL.
 * Note: depends on Facebook being available globally
 *
 * @param url
 * @returns {Promise<void>}
 */

export function facebookShare(url): Promise<void> {
    const FB = (<any>window).FB;

    return new Promise(function (ok, fail) {

        FB.ui({
            method: 'share',
            href: url
        }, function (response, ...args) {

            if (typeof response == undefined) {
                fail();
            } else {
                ok();
            }
        });
    });
}



from utils import get_all_user_factor_settings, dump_factor_settings

if __name__ == '__main__':
    lo_reasons = ['hurtProfits', 'irrelevant']
    for user, factor_settings in get_all_user_factor_settings(locked=False):
        if user.startswith('aschonfeld'):
            factor_settings['factors']['compensation_ind']['reasons'].append('riskReduce')
            dump_factor_settings(user, factor_settings)
            # for factor_id, inputs in factor_settings['factors'].items():
            #     if inputs['strength'] == 'LO':
            #         factor_settings['factors'][factor_id]['reasons'] = [lo_reasons[i] for i, _ in enumerate(inputs['reasons'])]
